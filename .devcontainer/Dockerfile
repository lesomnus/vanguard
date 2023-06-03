FROM ghcr.io/lesomnus/dev-node:18

RUN cd ~ \
	&& wget -O chrome.deb https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb \
	&& apt update \
	&& apt install ./chrome.deb --yes \
	&& apt-get clean --yes \
	&& rm -rf /var/lib/apt/lists/* \
	&& rm ./chrome.deb




USER hypnos

# Comment below lines if you don't want to use Zsh
RUN wget https://github.com/robbyrussell/oh-my-zsh/raw/master/tools/install.sh -O - | zsh || true \
	&& git clone https://github.com/zsh-users/zsh-autosuggestions         ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions     \
	&& git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting \
	&& git clone https://github.com/zsh-users/zsh-completions             ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-completions         \
	&& git clone https://github.com/supercrabtree/k                       ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/k
ADD .zshrc /home/hypnos
ENV SHELL /bin/zsh
